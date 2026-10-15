import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";

/**
 * Send a notification to an individual user
 */
export const notifyUser = async ({ recipient, recipientRole, type, title, message, data = {} }) => {
  try {
    if (!recipient) return null;

    let role = recipientRole;
    if (!role) {
      const u = await User.findById(recipient).select("role");
      role = u?.role || "customer";
    }

    return await Notification.create({
      recipient,
      recipientRole: role,
      type,
      title,
      message,
      data,
    });
  } catch (error) {
    console.error("Notify User Error:", error);
    return null;
  }
};

/**
 * Send notification to all users having a given role or roles (e.g. "admin", "superadmin")
 */
export const notifyRoles = async (roles, { type, title, message, data = {} }) => {
  try {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    const users = await User.find({ role: { $in: roleArray }, isActive: true }).select("_id role");

    if (!users || users.length === 0) return [];

    const notifications = users.map((u) => ({
      recipient: u._id,
      recipientRole: u.role,
      type,
      title,
      message,
      data,
    }));

    return await Notification.insertMany(notifications);
  } catch (error) {
    console.error("Notify Roles Error:", error);
    return [];
  }
};

/**
 * Comprehensive Order Lifecycle Notifications
 */
export const notifyOrderStateChange = async (order, nextStatus, details = {}) => {
  try {
    const orderNumber = order.orderNumber || order._id.toString();
    const customerId = order.customer?._id || order.customer;
    let restaurantName = order.restaurant?.name;
    let merchantUserId = order.restaurant?.merchantUser;

    if (!restaurantName || !merchantUserId) {
      const rest = await Restaurant.findById(order.restaurant?._id || order.restaurant);
      if (rest) {
        restaurantName = rest.name;
        merchantUserId = rest.merchantUser;
      }
    }

    const deliveryPartnerId = order.deliveryPartner?._id || order.deliveryPartner;

    switch (nextStatus) {
      case "PLACED":
        // 1. Customer: Order placed
        await notifyUser({
          recipient: customerId,
          recipientRole: "customer",
          type: "ORDER_PLACED",
          title: "Order Placed Successfully",
          message: `Your order #${orderNumber} from ${restaurantName || "kitchen"} has been placed.`,
          data: { orderId: order._id, orderNumber },
        });

        // 2. Merchant: New order
        if (merchantUserId) {
          await notifyUser({
            recipient: merchantUserId,
            recipientRole: "merchant",
            type: "NEW_ORDER",
            title: "New Incoming Kitchen Order",
            message: `New order #${orderNumber} received! Please review and confirm ticket.`,
            data: { orderId: order._id, orderNumber, totalAmount: order.totalAmount },
          });
        }

        // 3. Admin / Super Admin platform event
        await notifyRoles(["admin", "superadmin"], {
          type: "PLATFORM_EVENT",
          title: "New Order Ticket Placed",
          message: `Order #${orderNumber} placed for ₹${order.totalAmount} at ${restaurantName || "restaurant"}.`,
          data: { orderId: order._id, orderNumber },
        });
        break;

      case "CONFIRMED":
        // Customer: Confirmed
        await notifyUser({
          recipient: customerId,
          recipientRole: "customer",
          type: "ORDER_CONFIRMED",
          title: "Order Confirmed by Restaurant",
          message: `${restaurantName || "Kitchen"} has confirmed your order #${orderNumber}.`,
          data: { orderId: order._id, orderNumber },
        });
        break;

      case "PREPARING":
        // Customer: Preparing
        await notifyUser({
          recipient: customerId,
          recipientRole: "customer",
          type: "ORDER_PREPARING",
          title: "Meal Cooking in Kitchen",
          message: `The chef is preparing your dishes for order #${orderNumber}.`,
          data: { orderId: order._id, orderNumber },
        });
        break;

      case "READY_FOR_PICKUP":
        // 1. Customer: Ready
        await notifyUser({
          recipient: customerId,
          recipientRole: "customer",
          type: "ORDER_READY",
          title: "Order Ready for Pickup",
          message: `Order #${orderNumber} is freshly packed and waiting for delivery courier handover.`,
          data: { orderId: order._id, orderNumber },
        });

        // 2. Delivery fleet broadcast
        await notifyRoles("delivery", {
          type: "DISPATCH_AVAILABLE",
          title: "Ready Dispatch Mission",
          message: `Parcel ready at ${restaurantName || "restaurant counter"} for order #${orderNumber}.`,
          data: { orderId: order._id, orderNumber },
        });
        break;

      case "ACCEPTED":
      case "ASSIGNED":
        // 1. Customer: Delivery assigned
        await notifyUser({
          recipient: customerId,
          recipientRole: "customer",
          type: "DELIVERY_ASSIGNED",
          title: "Delivery Courier Assigned",
          message: `A delivery pilot is on the way to pick up order #${orderNumber}.`,
          data: { orderId: order._id, orderNumber, deliveryPartnerId },
        });

        // 2. Delivery partner: New assignment
        if (deliveryPartnerId) {
          await notifyUser({
            recipient: deliveryPartnerId,
            recipientRole: "delivery",
            type: "NEW_ASSIGNMENT",
            title: "New Delivery Mission Assigned",
            message: `Mission assigned: Collect order #${orderNumber} from ${restaurantName || "restaurant"}.`,
            data: { orderId: order._id, orderNumber },
          });
        }
        break;

      case "PICKED_UP":
        // Customer: Picked up
        await notifyUser({
          recipient: customerId,
          recipientRole: "customer",
          type: "ORDER_PICKED_UP",
          title: "Parcel Picked Up",
          message: `Your food parcel #${orderNumber} has been collected from ${restaurantName || "the counter"}.`,
          data: { orderId: order._id, orderNumber },
        });
        break;

      case "OUT_FOR_DELIVERY":
        // Customer: Out for delivery
        await notifyUser({
          recipient: customerId,
          recipientRole: "customer",
          type: "OUT_FOR_DELIVERY",
          title: "Out for Delivery",
          message: `Courier is en route to your dropoff address! Share OTP ${order.orderOtp || ""} upon arrival.`,
          data: { orderId: order._id, orderNumber, otp: order.orderOtp },
        });
        break;

      case "DELIVERED":
        // 1. Customer: Delivered
        await notifyUser({
          recipient: customerId,
          recipientRole: "customer",
          type: "ORDER_DELIVERED",
          title: "Order Delivered! Bon Appétit",
          message: `Order #${orderNumber} was successfully delivered. Please rate your meal and courier!`,
          data: { orderId: order._id, orderNumber },
        });

        // 2. Delivery partner: Delivery finished
        if (deliveryPartnerId) {
          await notifyUser({
            recipient: deliveryPartnerId,
            recipientRole: "delivery",
            type: "DELIVERY_COMPLETED",
            title: "Delivery Mission Completed",
            message: `Drop #${orderNumber} finished. Earnings credited to your shift wallet!`,
            data: { orderId: order._id, orderNumber },
          });
        }
        break;

      case "CANCELLED":
        // 1. Customer: Cancelled
        await notifyUser({
          recipient: customerId,
          recipientRole: "customer",
          type: "ORDER_CANCELLED",
          title: "Order Cancelled",
          message: `Order #${orderNumber} has been cancelled. ${details.reason || ""}`,
          data: { orderId: order._id, orderNumber, reason: details.reason },
        });

        // 2. Merchant: Cancellation
        if (merchantUserId) {
          await notifyUser({
            recipient: merchantUserId,
            recipientRole: "merchant",
            type: "ORDER_CANCELLED",
            title: "Order Ticket Cancelled",
            message: `Order #${orderNumber} has been cancelled.`,
            data: { orderId: order._id, orderNumber, reason: details.reason },
          });
        }

        // 3. Delivery: Cancellation (if partner was assigned)
        if (deliveryPartnerId) {
          await notifyUser({
            recipient: deliveryPartnerId,
            recipientRole: "delivery",
            type: "ORDER_CANCELLED",
            title: "Delivery Mission Cancelled",
            message: `Assigned order #${orderNumber} has been cancelled. You are freed for new drops.`,
            data: { orderId: order._id, orderNumber },
          });
        }
        break;
    }
  } catch (error) {
    console.error("Notify Order State Change Error:", error);
  }
};

/**
 * Onboarding application alerts for Admin and Super Admin
 */
export const notifyMerchantApplication = async (application) => {
  return await notifyRoles(["admin", "superadmin"], {
    type: "NEW_MERCHANT_APPLICATION",
    title: "New Merchant Application",
    message: `Application submitted for restaurant '${application.restaurantName || "New Merchant"}' by ${application.ownerName || "applicant"}.`,
    data: { applicationId: application._id, restaurantName: application.restaurantName },
  });
};

export const notifyDeliveryApplication = async (application) => {
  return await notifyRoles(["admin", "superadmin"], {
    type: "NEW_DELIVERY_APPLICATION",
    title: "New Delivery Partner Application",
    message: `Application submitted by ${application.fullName || "new courier"} (${application.vehicleType || "vehicle"}).`,
    data: { applicationId: application._id, fullName: application.fullName },
  });
};
