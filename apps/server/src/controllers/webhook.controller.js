import { Hr } from "../models/hr.model.js";
import { Webhook } from "svix";

const clerkWebhook = async (req, res) => {
  try {
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SIGNING_SECRET);

    const payload = req.body?.toString("utf8");
    const evt = wh.verify(payload, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { data, type } = evt;

    switch (type) {
      case "user.created": {
        const primaryEmail = data.email_addresses.find(
          e => e.id === data.primary_email_address_id
        )?.email_address;

        const hrData = {
          clerkUserId: data.id,
          name: `${data.first_name} ${data.last_name}`,
          email: primaryEmail,
          avatar: data.image_url,
        };

        await Hr.findOneAndUpdate(
            {clerkUserId: data.id},
            hrData,
            { upsert: true, new: true }
        );
        break;
      }

      case "user.updated": {
        const primaryEmail = data.email_addresses.find(
          e => e.id === data.primary_email_address_id
        )?.email_address;

        const hrData = {
          name: [data.first_name, data.last_name].filter(Boolean).join(" ") || "Anonymous",
          email: primaryEmail,
          avatar: data.image_url,
        };

        await Hr.findOneAndUpdate(
            {clerkUserId: data.id},
            hrData,
            { new: true }   
        );
        break;
      }

      case "user.deleted": {
        await Hr.findOneAndDelete({clerkUserId: data.id});
        break;
      }

      default:
        console.log(`Unhandled Clerk event type: ${type}`);
        break;
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error("Webhook error:", error.message);
    return res.status(400).json({ message: "Invalid webhook signature or bad request" });
  }
};

export { clerkWebhook };