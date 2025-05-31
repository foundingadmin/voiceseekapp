import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  try {
    const { image } = JSON.parse(event.body || '{}');
    if (!image) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No image data provided' })
      };
    }

    // Create form data for ImgBB
    const params = new URLSearchParams();
    params.append('key', IMGBB_API_KEY!);
    params.append('image', image.split(',')[1]); // Remove data:image/png;base64,

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: params
    });

    if (!response.ok) {
      throw new Error(`ImgBB API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to upload to ImgBB');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: data.data.url
      })
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to upload image' })
    };
  }
}