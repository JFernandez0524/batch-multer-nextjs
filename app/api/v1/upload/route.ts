export const dynamic = 'force-dynamic'; // defaults to auto
export async function GET(request: Request) {
  console.log(request);
  return Response.json({ status: 200, message: 'it works' });
}
