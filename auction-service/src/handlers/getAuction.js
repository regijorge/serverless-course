import AWS from 'aws-sdk'
import middy from '@middy/core'
import httpJsonBodyParser from '@middy/http-json-body-parser'
import httpEventNormalizer from '@middy/http-event-normalizer'
import httpErrorHandler from '@middy/http-error-handler'
import createError from 'http-errors'

const dynamodb = new AWS.DynamoDB.DocumentClient()

async function getAuction(event, context) {
  const { id } = event.pathParameters
  let auction

  try {
    const result = await dynamodb.get({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Key: { id }
    }).promise()
    auction = result.Item
  } catch (error) {
    console.log(error)
    throw createError.InternalServerError(error)
  }

  if (!auction) {
    throw createError.NotFound('Not found')
  }

  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  }
}

export const handler = middy(getAuction)
  .use(httpJsonBodyParser())
  .use(httpEventNormalizer())
  .use(httpErrorHandler())
