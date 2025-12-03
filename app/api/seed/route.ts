import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Business from "@/lib/models/Business";
import Staff from "@/lib/models/Staff";
import Service from "@/lib/models/Service";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    console.log("Connected to database");

    // Create a test user
    let user = await User.findOne({ email: "test@example.com" });
    if (!user) {
      const hashedPassword = await bcrypt.hash("password123", 12);
      
      const lastRecord = await User.findOne().sort({ counterId: -1 }).limit(1);
      const counterId = lastRecord ? lastRecord.counterId + 1 : 1;

      user = await User.create({
        fname: "John",
        lname: "Doe",
        email: "test@example.com",
        username: "johndoe",
        password: hashedPassword,
        address: "123 Main St, Melbourne, VIC 3000",
        contactNo: "0412345678",
        counterId,
        verify: "yes",
      });
      console.log("Created test user:", user.email);
    }

    // Create businesses
    const businesses = [
      {
        userId: user._id,
        businessName: "Annie's Salon",
        email: "annie@salon.com",
        phone: "0398765432",
        address: "22 North Street, Richmond, VIC 3121",
        story: "Professional hair salon specializing in cuts, colors, and styling.",
        status: "approved",
      },
      {
        userId: user._id,
        businessName: "Bliss Nails",
        email: "bliss@nails.com",
        phone: "0398765433",
        address: "45 Collins Street, Melbourne, VIC 3000",
        story: "Premium nail salon offering manicures, pedicures, and nail art.",
        status: "approved",
      },
      {
        userId: user._id,
        businessName: "Serenity Massage",
        email: "serenity@massage.com",
        phone: "0398765434",
        address: "78 Chapel Street, South Yarra, VIC 3141",
        story: "Relaxing massage and wellness center.",
        status: "approved",
      },
      {
        userId: user._id,
        businessName: "Pawfect Grooming",
        email: "pawfect@grooming.com",
        phone: "0398765435",
        address: "12 Bark Street, Fitzroy, VIC 3065",
        story: "Professional dog grooming services.",
        status: "approved",
      },
    ];

    const createdBusinesses = [];
    for (const bizData of businesses) {
      let business = await Business.findOne({ email: bizData.email });
      if (!business) {
        business = await Business.create(bizData);
        console.log("Created business:", business.businessName);
      }
      createdBusinesses.push(business);
    }

    // Create staff for Annie's Salon
    const anniesSalon = createdBusinesses[0];
    const staffMembers = [
      {
        businessId: anniesSalon._id,
        name: "Annie",
        bio: "Master stylist with 10 years of experience in hair cutting and coloring.",
        isActive: true,
      },
      {
        businessId: anniesSalon._id,
        name: "Lisa",
        bio: "Expert in hair styling and blow-dry techniques.",
        isActive: true,
      },
      {
        businessId: anniesSalon._id,
        name: "May",
        bio: "Specializes in hair treatments and color correction.",
        isActive: true,
      },
    ];

    const createdStaff: any[] = [];
    for (const staffData of staffMembers) {
      let staff = await Staff.findOne({ 
        businessId: staffData.businessId, 
        name: staffData.name 
      });
      if (!staff) {
        staff = await Staff.create(staffData);
        console.log("Created staff:", staff.name);
      }
      createdStaff.push(staff);
    }

    // Create services with time slots
    const now = new Date();
    const futureDates = [
      new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // Day after
      new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
    ];

    const services = [
      // Hair Services
      {
        businessId: anniesSalon._id,
        category: "Hair Services",
        subCategory: "Haircuts",
        serviceName: "Women's Cut & Style",
        duration: "2hr",
        baseCost: 250,
        description: "Professional haircut and styling for women. Includes consultation, cut, wash, and style.",
        address: anniesSalon.address,
        addOns: [
          { name: "Scalp Massage", cost: 30 },
          { name: "Toner", cost: 20 },
          { name: "Extra Blow-Dry", cost: 50 },
        ],
        timeSlots: futureDates.slice(0, 3).map((date, idx) => ({
          date: date,
          startTime: idx === 0 ? "10:00" : "14:00",
          endTime: idx === 0 ? "12:00" : "16:00",
          cost: 250,
          staffIds: [createdStaff[0]._id, createdStaff[1]._id],
          isBooked: false,
        })),
        status: "listed",
      },
      {
        businessId: anniesSalon._id,
        category: "Hair Services",
        subCategory: "Colouring",
        serviceName: "Full Color Service",
        duration: "3hr",
        baseCost: 320,
        description: "Complete hair coloring service with consultation and aftercare tips.",
        address: anniesSalon.address,
        addOns: [
          { name: "Toner", cost: 20 },
          { name: "Hydration/Repair Treatment", cost: 10 },
        ],
        timeSlots: futureDates.slice(1, 4).map((date, idx) => ({
          date: date,
          startTime: idx === 0 ? "09:00" : "13:00",
          endTime: idx === 0 ? "12:00" : "16:00",
          cost: 320,
          staffIds: [createdStaff[0]._id, createdStaff[2]._id],
          isBooked: false,
        })),
        status: "listed",
      },
      {
        businessId: anniesSalon._id,
        category: "Hair Services",
        subCategory: "Blow-Dry & Styling",
        serviceName: "Blow-Dry & Style",
        duration: "1hr",
        baseCost: 80,
        description: "Professional blow-dry and styling service.",
        address: anniesSalon.address,
        addOns: [
          { name: "Extra Blow-Dry", cost: 50 },
        ],
        timeSlots: futureDates.slice(0, 5).map((date, idx) => ({
          date: date,
          startTime: idx < 2 ? "10:00" : "15:00",
          endTime: idx < 2 ? "11:00" : "16:00",
          cost: 80,
          staffIds: [createdStaff[1]._id],
          isBooked: false,
        })),
        status: "listed",
      },
      // Nails
      {
        businessId: createdBusinesses[1]._id,
        category: "Nails",
        serviceName: "Classic Manicure",
        duration: "45min",
        baseCost: 45,
        description: "Traditional manicure with nail shaping, cuticle care, and polish.",
        address: createdBusinesses[1].address,
        addOns: [
          { name: "Gel Polish", cost: 15 },
          { name: "Nail Art", cost: 25 },
        ],
        timeSlots: futureDates.slice(0, 4).map((date, idx) => ({
          date: date,
          startTime: idx < 2 ? "10:00" : "14:00",
          endTime: idx < 2 ? "10:45" : "14:45",
          cost: 45,
          staffIds: [],
          isBooked: false,
        })),
        status: "listed",
      },
      // Massage & Wellness
      {
        businessId: createdBusinesses[2]._id,
        category: "Massage & Wellness",
        serviceName: "Relaxation Massage",
        duration: "1hr",
        baseCost: 120,
        description: "Full body relaxation massage to relieve stress and tension.",
        address: createdBusinesses[2].address,
        addOns: [
          { name: "Hot Stones", cost: 30 },
          { name: "Aromatherapy Oils", cost: 20 },
          { name: "Extra 15 mins", cost: 30 },
        ],
        timeSlots: futureDates.slice(0, 3).map((date, idx) => ({
          date: date,
          startTime: idx === 0 ? "11:00" : "15:00",
          endTime: idx === 0 ? "12:00" : "16:00",
          cost: 120,
          staffIds: [],
          isBooked: false,
        })),
        status: "listed",
      },
      // Dog Grooming
      {
        businessId: createdBusinesses[3]._id,
        category: "Dog Grooming",
        subCategory: "Full Groom",
        serviceName: "Full Grooming Service",
        duration: "2hr",
        baseCost: 100,
        description: "Complete grooming service including bath, cut, nail trim, and ear cleaning.",
        address: createdBusinesses[3].address,
        addOns: [
          { name: "Teeth Cleaning", cost: 25 },
          { name: "Flea Treatment", cost: 20 },
        ],
        timeSlots: futureDates.slice(0, 4).map((date, idx) => ({
          date: date,
          startTime: idx < 2 ? "09:00" : "13:00",
          endTime: idx < 2 ? "11:00" : "15:00",
          cost: 100,
          staffIds: [],
          isBooked: false,
        })),
        status: "listed",
      },
    ];

    for (const serviceData of services) {
      let service = await Service.findOne({
        businessId: serviceData.businessId,
        serviceName: serviceData.serviceName,
      });
      if (!service) {
        service = await Service.create(serviceData);
        console.log("Created service:", service.serviceName);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Seed data created successfully!",
      testUser: {
        email: "test@example.com",
        password: "password123",
      },
    });
  } catch (error: any) {
    console.error("Error seeding data:", error);
    return NextResponse.json(
      { error: "Failed to seed data", details: error.message },
      { status: 500 }
    );
  }
}

