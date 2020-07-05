import { v4 as uuid } from 'uuid'
import AWS from 'aws-sdk'
import commonMiddleware from '../lib/commonMiddleware'
import createError from 'http-errors'
import { getAuctionById } from './getAuction'

const dynamodb = new AWS.DynamoDB.DocumentClient()

async function placeBid(event, context) {
  const { id } = event.pathParameters
  const { amount } = event.body

  const auction = await getAuctionById(id)

  if (auction.status !== 'OPEN') {
    throw createError.Forbidden('You can not bid on closed auctions')
  }

  if (amount <= auction.highestBid.amount) {
    throw createError.Forbidden('Amoount must be higher')
  }

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression: 'set highestBid.amount = :amount',
    ExpressionAttributeValues: {
      ':amount': amount
    },
    ReturnValues: 'ALL_NEW'
  }

  let upadtedAuction
  try {
    const result = await dynamodb.update(params).promise()
    upadtedAuction = result.Attributes
  } catch (error) {
    console.log(error)
    throw createError.InternalServerError(error)
  }

  return {
    statusCode: 201,
    body: JSON.stringify(upadtedAuction),
  }
}

export const handler = commonMiddleware(placeBid)