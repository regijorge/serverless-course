import { getAuctionById } from './getAuction'
import { uploadPictureToS3 } from '../lib/uploadPictureToS3';
import { setAuctionPictureUrl } from '../lib/setAuctionPictureUrl'
import middy from '@middy/core'
import httpErrorHandler from '@middy/http-error-handler'
import createError from 'http-errors'

async function uploadAuctionPicture(event, context) {
  const { id } = event.pathParameters
  const { email } = event.requestContext.authorizer

  const auction = await getAuctionById(id)

  if (email !== auction.seller) {
    throw createError.Forbidden('You are not owner of this auction!')
  }

  const base64 = event.body.replace(/^data:image\/\w+base64,/, '')
  const buffer = Buffer.from(base64, 'base64')

  let updatedAuction
  try {
    const pictureUrl = await uploadPictureToS3(auction.id + '.jpg', buffer)
    updatedAuction = await setAuctionPictureUrl(auction.id, pictureUrl)
  } catch (error) {
    console.log(error)
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction)
  }
}

export const handler = middy(uploadAuctionPicture)
  .use(httpErrorHandler())
