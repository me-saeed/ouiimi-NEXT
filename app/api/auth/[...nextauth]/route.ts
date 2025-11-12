import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/jwt";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username/Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        await dbConnect();

        const user = await User.findOne({
          $or: [
            { email: credentials.username.toLowerCase() },
            { username: credentials.username.toLowerCase() },
          ],
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.fname} ${user.lname}`,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "facebook") {
        await dbConnect();

        const email = user.email?.toLowerCase() || "";
        const oauthId = account.providerAccountId;
        const oauthProvider = account.provider;

        let dbUser = await User.findOne({
          $or: [
            { oauthId, oauthProvider },
            { email },
          ],
        });

        if (!dbUser) {
          const nameParts = user.name?.split(" ") || ["User", ""];
          const lastRecord = await User.findOne()
            .sort({ counterId: -1 })
            .limit(1);
          const counterId = lastRecord ? lastRecord.counterId + 1 : 1;

          dbUser = await User.create({
            fname: nameParts[0] || "User",
            lname: nameParts.slice(1).join(" ") || "",
            email,
            oauthProvider,
            oauthId,
            pic: user.image || "avatar.png",
            verify: "yes",
            counterId,
          });
        } else if (!dbUser.oauthProvider || !dbUser.oauthId) {
          dbUser.oauthProvider = oauthProvider;
          dbUser.oauthId = oauthId;
          if (user.image) dbUser.pic = user.image;
          await dbUser.save();
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }

      if (account) {
        token.accessToken = account.access_token;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    signOut: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

