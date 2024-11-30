export function jsonResponse(obj, status = 200 ) {
    const responseHeaders = new Headers({
        "Content-Type": "application/json",

      });
    const response = new Response(
        JSON.stringify(obj),
        {
            status: status,
            headers: responseHeaders,
        }
    );
}