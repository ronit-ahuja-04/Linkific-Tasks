import { problem } from '@/lib/server/http';

/**
 * Any /api/... address that matches no endpoint. Without this file Next.js answered with the HTML not-found PAGE
 * (inventory row N7), which an API client can not read. Real endpoints are more specific and always win
 * (/api/quests, /api/auth/[...nextauth], …), so only unknown addresses arrive here.
 */
const unknownEndpoint = async (): Promise<Response> => problem(404, 'There is no API endpoint at this address.');

export const GET = unknownEndpoint;
export const POST = unknownEndpoint;
export const PUT = unknownEndpoint;
export const PATCH = unknownEndpoint;
export const DELETE = unknownEndpoint;
