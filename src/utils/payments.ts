import { generateSecretKey, finalizeEvent, getPublicKey } from "nostr-tools";
import { makeZapRequest } from "nostr-tools/nip57";
import { DEFAULT_RELAYS } from "./relayConfig";

interface GenerateInvoiceParams {
    lightningAddress: string;
    amount: number;
    message: string;
    moonshotId: string;
    recipientPubkey: string;
}

export async function generateMoonshotInvoice(
    params: GenerateInvoiceParams
): Promise<{ invoice: string; zapRequest: any } | null> {
    const { lightningAddress, amount, message, moonshotId, recipientPubkey } = params;

    try {
        const [username, domain] = lightningAddress.split("@");
        if (!username || !domain) {
            throw new Error("Invalid Lightning address");
        }

        const senderPrivkey = generateSecretKey();
        const senderPubkey = getPublicKey(senderPrivkey);

        const lnurlUrl = `https://${domain}/.well-known/lnurlp/${username}`;
        const lnurlResponse = await fetch(lnurlUrl);

        if (!lnurlResponse.ok) {
            throw new Error("Lightning address not found");
        }

        const lnurlData = await lnurlResponse.json();

        if (!lnurlData.allowsNostr || !lnurlData.nostrPubkey) {
            throw new Error("This Lightning address does not support zaps");
        }

        const zapRequestTemplate = makeZapRequest({
            profile: recipientPubkey,
            event: null,
            amount: amount * 1000,
            relays: DEFAULT_RELAYS,
            comment: message,
        });

        zapRequestTemplate.tags.push(["moonshot", moonshotId]);

        const signedZapRequest = finalizeEvent(zapRequestTemplate, senderPrivkey);

        const callbackUrl = new URL(lnurlData.callback);
        callbackUrl.searchParams.set("amount", (amount * 1000).toString());
        callbackUrl.searchParams.set("nostr", JSON.stringify(signedZapRequest));

        const invoiceResponse = await fetch(callbackUrl.toString());

        if (!invoiceResponse.ok) {
            throw new Error("Failed to get invoice");
        }

        const invoiceData = await invoiceResponse.json();

        if (invoiceData.status === "ERROR") {
            throw new Error(invoiceData.reason || "Invoice generation failed");
        }

        if (!invoiceData.pr) {
            throw new Error("No invoice returned");
        }

        return {
            invoice: invoiceData.pr,
            zapRequest: signedZapRequest,
        };
    } catch (error) {
        console.error("Generate invoice error:", error);
        throw error;
    }
}

export function parseZapReceipt(zapReceipt: any): {
    amount: number;
    message: string;
    moonshotId?: string;
} | null {
    try {
        const descriptionTag = zapReceipt.tags.find((t: string[]) => t[0] === "description");
        if (!descriptionTag || !descriptionTag[1]) {
            return null;
        }

        const zapRequest = JSON.parse(descriptionTag[1]);
        const message = zapRequest.content || "";

        const moonshotTag = zapRequest.tags?.find((t: string[]) => t[0] === "moonshot");
        const moonshotId = moonshotTag?.[1];

        const amountTag = zapRequest.tags?.find((t: string[]) => t[0] === "amount");
        const amountMillisats = amountTag?.[1] ? parseInt(amountTag[1]) : 0;
        const amount = Math.floor(amountMillisats / 1000);

        return {
            amount,
            message,
            moonshotId,
        };
    } catch (error) {
        console.error("Failed to parse zap receipt:", error);
        return null;
    }
}