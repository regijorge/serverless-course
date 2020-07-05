export const getAuctionsSchema = {
  properties: {
    queryStringProperties: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['OPEN', 'CLOSED'],
          default: 'OPEN'
        }
      }
    }
  },
  required: [
    'queryStringProperties'
  ]
}