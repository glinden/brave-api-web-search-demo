
document.getElementById('search-input').addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        runSearch();
    }
});

function clearSearchResults() {
    document.getElementById('results').innerHTML = '';
    document.getElementById('results-error').innerText = '';
}

function displaySearchResults(data) {
    // For debugging, just display JSON
    // document.getElementById('results').innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;

    if (!data || !data.web || !data.web.results) { 
        // Nothing! This doesn't happen very often.
        document.getElementById('results').innerHTML = 'Sorry, there are no results for that query.';
        return;
    }

    let webPages = data.web.results;

    // Splice to top eight, then iterate through creating result divs with title, display URL, snippet
    const topResults = webPages.toSpliced(8);
    const allResultsDiv = document.getElementById("results");
    topResults.forEach((page, pageIndex) => {        
        // Create a clickable div to put this result in
        const anchor = document.createElement("a");
        anchor.classList.add("result-anchor");
        anchor.href = page.url;
        const resultDiv = document.createElement("div");
        resultDiv.classList.add("result");
        anchor.appendChild(resultDiv);

        // Now add three divs to the result div, one each for the title, display url, and snippet
        const resultTitleDiv = document.createElement("div");
        resultTitleDiv.classList.add("result-title");
        resultTitleDiv.innerText = page.title;
        resultDiv.appendChild(resultTitleDiv);
        if (page.url) {
            const resultUrlDiv = document.createElement("div");
            resultUrlDiv.classList.add("result-url");
            resultUrlDiv.innerText = page.url;
            resultDiv.appendChild(resultUrlDiv);
        }
        if (page.description) {
            const resultSnippetDiv = document.createElement("div");
            resultSnippetDiv.classList.add("result-snippet");
            resultSnippetDiv.innerHtml = page.description;
            resultDiv.appendChild(resultSnippetDiv);
        }
        
        // Now add the anchor for this result to the list of all results
        allResultsDiv.appendChild(anchor);
    });
}

var currentlyWaiting = false;
function enableWaitingAnimation() {
    // Make visible three dots animation
    document.getElementById('dot-carousel').style.visibility = 'visible';
    currentlyWaiting = true;
}

function disableWaitingAnimation() {
    // Make invisible the three dots animation
    document.getElementById('dot-carousel').style.visibility = 'hidden';
    currentlyWaiting = false;
}

function changeWindowUrl(query) {
    const url = new URL(window.location.href);
    url.search = query ? `q=${query}` : '';
    // If the URL changed, toss it into the history so the back button works
    if (window.location.href != url.toString()) {
        window.history.pushState({}, document.title, url.toString());
    }
}

headers = {};
function runSearch() {
    clearSearchResults();
    const query = document.getElementById('search-input').value;
    changeWindowUrl(query);

    // Stop here if there's no query or if we're already executing a query
    if (!query) { return; }
    if (currentlyWaiting) { return; }

    enableWaitingAnimation();
    fetch(`/search?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: headers,
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error.message);         
        }
        displaySearchResults(data);
        document.getElementById('results-error').innerText = '';
    })
    .catch(error => {
        document.getElementById('results').innerHTML = '';
        document.getElementById('results-error').innerText = `Error: ${error.message}`;
        console.log(error.message);
    })
    .finally(() => {
        disableWaitingAnimation();
    });
};

// Support using the back and forward buttons in the browser by re-executing searches when necessary
window.addEventListener('popstate', function(event) {
    const url = new URL(window.location.href);
    let query = '';
    if (url.searchParams) { query = url.searchParams.get('q'); }
    document.getElementById('search-input').value = query;
    // Call runSearch even if there isn't a query to clear the page when there is no query
    runSearch();
});


// Support query strings in the URL, mostly useful for queries from the address bar of browsers
window.addEventListener('load', function() {
    // Wait for the page to fully load before executing any query in the URL
    const url = new URL(window.location.href);
    const query = url.searchParams.get('q');
    if (query) {
        document.getElementById('search-input').value = query;
        runSearch();
    }
});


// Brave API wants the location if possible for more relevant results, so go get it if we can
function geolocate_success(position) {
    const coords = position.coords;
    const additional_location_header = {
	    'X-Loc-Lat': coords.latitude,
	    'X-Loc-Long': coords.longitude,
    };
    Object.assign(headers, additional_location_header);
    // console.log(headers);
}
function geolocate_error(err) {
    // console.warn(`ERROR(${err.code}): ${err.message}`);
}
navigator.geolocation.getCurrentPosition(geolocate_success, geolocate_error);
