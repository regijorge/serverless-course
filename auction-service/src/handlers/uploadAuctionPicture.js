import { v4 as uuid } from 'uuid'
import AWS from 'aws-sdk'
import commonMiddleware from '../lib/commonMiddleware'
import createError from 'http-errors'
import { getAuctionById } from './getAuction'
import validator from '@middy/validator'
import schema from '../lib/schemas/placeBidSchema'

const dynamodb = new AWS.DynamoDB.DocumentClient()

async function uploadAuctionPicture(event, context) {
  const { id } = event.pathParameters
  const { email } = event.requestContext.authorizer
  const { amount } = event.body

  AUCTIONS_BUCKET_NAME

  const auction = await getAuctionById(id)

  if (email <= auction.seller) {
    throw createError.Forbidden('You can not bid on your own auction')
  }

  if (email <= auction.highestBid.bidder) {
    throw createError.Forbidden('You are already the highest bidder')
  }

  if (auction.status !== 'OPEN') {
    throw createError.Forbidden('You can not bid on closed auctions')
  }

  if (amount <= auction.highestBid.amount) {
    throw createError.Forbidden('Amoount must be higher')
  }

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',
    ExpressionAttributeValues: {
      ':amount': amount,
      ':bidder': email
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

export const handler = uploadAuctionPicture
