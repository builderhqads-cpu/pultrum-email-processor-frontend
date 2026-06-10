import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {params: Promise<{path: string[]}>};

function getBackendBaseUrl() {
  const raw = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  if (!raw) {
    throw new Error('NEXT_PUBLIC_API_URL is not set');
  }
  return raw.replace(/\/+$/, '');
}

async function forward(request: NextRequest, ctx: RouteContext) {
  const {path} = await ctx.params;
  const url = new URL(request.url);
  const backendBase = getBackendBaseUrl();
  const target = new URL(`${backendBase}/${path.join('/')}${url.search}`);

  const headers = new Headers(request.headers);
  headers.delete('host');

  // Avoid leaking Next.js cookies/headers to backend unintentionally.
  headers.delete('cookie');

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
    cache: 'no-store'
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    // `NextRequest.body` is a ReadableStream. Node's fetch requires `duplex: 'half'`
    // when sending a streamed request body.
    if (request.body) {
      init.body = request.body;
      // @ts-expect-error `duplex` is required by Node's fetch when streaming a body.
      init.duplex = 'half';
    }
  }

  const res = await fetch(target, init);

  const resHeaders = new Headers(res.headers);
  resHeaders.delete('set-cookie');
  resHeaders.delete('content-encoding');

  return new NextResponse(res.body, {
    status: res.status,
    headers: resHeaders
  });
}

export async function GET(request: NextRequest, ctx: RouteContext) {
  return forward(request, ctx);
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  return forward(request, ctx);
}

export async function PUT(request: NextRequest, ctx: RouteContext) {
  return forward(request, ctx);
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  return forward(request, ctx);
}

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  return forward(request, ctx);
}
