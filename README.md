# bing-web-search-api-demo

A working demo of querying the Bing web search API and displaying the results.

Demonstrates a node.js website that displays a search form, uses client-side Javascript to send queries server-side
to maintain same-origin policy required by web browsers, gets web search results from Bing, and displays them nicely
for searchers to use. Also asks for permission to use the approximate location and passes that and the user IP through
to the Bing web search API for localizing the results, which makes them much more relevant on some queries.

I couldn't find many good examples of doing this end-to-end. It would have been useful to me to have a good example to work from
on a project I was doing, so I thought I'd release this to help others.

You will need your own Bing API key to use this which you can get for free (for personal use) using Microsoft Azure.
One you have a Bing API key, you can try this out by running 'BING_API_KEY=your-key-here node node-server.js' on
the command line to start a local webserver running on port 3000, then go to http://localhost:3000 to use it.
