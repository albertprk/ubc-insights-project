/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function(query) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("POST", "/query", true);
        request.send(JSON.stringify(query));
        request.onload = function () {
            if (request.status !== 200) {
              console.log("Request was not successful");
              reject("Request was not successful");
            } else {
              resolve();
            }
        };
    });
};
