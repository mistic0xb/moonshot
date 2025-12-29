import { useQuery } from "@tanstack/react-query";
import { fetchTrustScoresBatch } from "../utils/nostr/trustScore";

export function useTrustScores(pubkeys: string[]) {
    return useQuery({
        queryKey: ["trust-scores", pubkeys],
        queryFn: () => fetchTrustScoresBatch(pubkeys),
        enabled: pubkeys.length > 0,
        staleTime: 1000 * 60 * 60, // 1 hour
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
}

export function useTrustScore(pubkey: string) {
    return useQuery({
        queryKey: ["trust-score", pubkey],
        queryFn: async () => {
            const scores = await fetchTrustScoresBatch([pubkey]);
            return scores.get(pubkey) || null;
        },
        enabled: !!pubkey,
        staleTime: 1000 * 60 * 60, // 1 hour
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
}