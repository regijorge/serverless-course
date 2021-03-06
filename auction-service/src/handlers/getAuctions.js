import AWS from 'aws-sdk'
import commonMiddleware from '../lib/commonMiddleware'
import validator from '@middy/validator'
import getAuctionsSchema from '../lib/schemas/getAuctionsSchema'
import createError from 'http-errors'

const dynamodb = new AWS.DynamoDB.DocumentClient()

async function getAuctions(event, context) {
  const { status } = event.queryStringParameters
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: 'statusAndEndingDate',
    KeyConditionExpression: '#status = :status',
    ExpressionAttributeValues: {
      ':status': status,
    },
    ExpressionAttributeNames: {
      '#status': 'status'
    }
  }

  let auctions

  try {
    const result = await dynamodb.query(params).promise()
    auctions = result.Items
  } catch (error) {
    console.log(error)
    throw createError.InternalServerError(error)
  }

  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  }
}

export const handler = commonMiddleware(getAuctions)
  .use(validator({ inputSchema: getAuctionsSchema, useDefaults: true }))