export async function POST(request: Request) {
	console.log(request);
	const body = await request.json();
	console.log(body);

	return Response.json({ success: true }, { status: 200 });
}
