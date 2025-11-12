export function getEmailHeader(): string {
  return `
    <div>
      <a href="${process.env.NEXTAUTH_URL || "https://ouiimi.com"}/" target="_blank" class="heading">
        <h1 style="color: white; background-color: #f8f8f8; width: full; padding: 24px; justify-content: center; display: flex; color: black; border: 1px solid black;">
          ouiimi
        </h1>
      </a>
    </div>
  `;
}

