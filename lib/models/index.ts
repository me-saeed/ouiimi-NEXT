/**
 * Centralized model exports
 * Import all models here to ensure they're registered with Mongoose
 */

import User from "./User";
import Business from "./Business";
import Staff from "./Staff";
import Service from "./Service";
import Booking from "./Booking";
import ForgetPass from "./ForgetPass";

// Export all models
export { User, Business, Staff, Service, Booking, ForgetPass };

// Export interfaces
export type { IUser } from "./User";
export type { IBusiness } from "./Business";
export type { IStaff } from "./Staff";
export type { IService, ITimeSlot, IAddOn } from "./Service";
export type { IBooking } from "./Booking";
export type { IForgetPass } from "./ForgetPass";

