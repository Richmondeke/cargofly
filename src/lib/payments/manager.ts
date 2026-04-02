import { KorapayProvider } from "./korapay";
import {
    PaymentInitializationRequest,
    PaymentInitializationResponse,
    PaymentProvider
} from "./types";

export class PaymentManager {
    private providers: PaymentProvider[] = [];
    private initialized: boolean = false;

    private ensureInitialized() {
        if (this.initialized) return;

        console.log("Initializing PaymentManager providers...");

        // Initialize with Korapay as primary
        const korapayKey = process.env.KORAPAY_SECRET_KEY;
        if (korapayKey) {
            console.log("Korapay provider configured successfully.");
            this.providers.push(new KorapayProvider(korapayKey));
        } else {
            console.warn("KORAPAY_SECRET_KEY is missing from environment variables.");
        }

        // Future: Add Backup (Paystack) and Tertiary (Flutterwave)
        // if (process.env.PAYSTACK_SECRET_KEY) {
        //     this.providers.push(new PaystackProvider(process.env.PAYSTACK_SECRET_KEY));
        // }

        if (this.providers.length === 0) {
            console.error("No payment providers were successfully configured. Check your .env files.");
        }

        this.initialized = true;
    }

    async initializePayment(request: PaymentInitializationRequest): Promise<PaymentInitializationResponse> {
        this.ensureInitialized();
        let lastError = "No payment providers configured";

        for (const provider of this.providers) {
            console.log(`Attempting payment initialization with ${provider.name}...`);
            try {
                const response = await provider.initialize(request);

                if (response.status) {
                    return response;
                }

                lastError = `[${provider.name}]: ${response.message}`;
                console.warn(`Payment provider ${provider.name} failed: ${response.message}`);
            } catch (error: any) {
                lastError = `[${provider.name}] (Critical): ${error.message}`;
                console.error(`Critical failure in provider ${provider.name}:`, error);
            }
            // If primary fails, continue to next provider (Backup, then Tertiary)
        }

        return {
            status: false,
            message: `All payment providers failed. Last error: ${lastError}`,
            data: { checkout_url: "", reference: request.reference, provider: "none" }
        };
    }
}

// Singleton instance
export const paymentManager = new PaymentManager();
