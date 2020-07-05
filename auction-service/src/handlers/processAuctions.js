import { getEndedAuctions } from '../lib/getEndedAuctions'

async function processAuctions(event, context) {
  const auctionsToBeClosed = await getEndedAuctions()
}

export const handler = processAuctions