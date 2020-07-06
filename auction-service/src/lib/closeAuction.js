import AWS from 'aws-sdk'

const dynamodb = new AWS.DynamoDB.DocumentClient()
const sqs = new AWS.SQS()

export async function closeAuction(auction) {
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id: auction.id },
    UpdateExpression: 'set #status = :status',
    ExpressionAttributeValues: {
      ':status': 'CLOSED'
    },
    ExpressionAttributeNames: {
      '#status': 'status'
    }
  }

  await dynamodb.update(params).promise()

  const { title, seller, highestBid } = auction
  const { amount, bidder } = highestBid

  const notifySeller = await sqs.sendMessage({
    QueueUrl: process.env.MAIL_QUEUE_URL,
    MessageBody: JSON.stringify({
      subject: 'Auction sold!',
      recipient: seller,
      body: `Your auction has been sold with $ ${amount}`
    })
  }).promise()

  const notifyBidder = await sqs.sendMessage({
    QueueUrl: process.env.MAIL_QUEUE_URL,
    MessageBody: JSON.stringify({
      subject: 'You won an auction!',
      recipient: bidder,
      body: `Your won auction ${title}`
    })
  }).promise()

  return Promise.all([
    notifySeller,
    notifyBidder
  ])
}
