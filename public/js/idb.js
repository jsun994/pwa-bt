let db;
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function(event) {
    //when db is successfully created with its object store, save reference to db in global variable
    db = event.target.result;

    //check if app is online, if yes run checkDatabase() function to send all local db data to api
    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function(event) {
    //log error
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const transObjectStore = transaction.objectStore('new_transaction');
    //add record to store with add method
    transObjectStore.add(record);
}

function uploadTransaction() {
    //open a transaction on pending db
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    //access your pending object store
    const transObjectStore = transaction.objectStore('new_transaction');

    //get all records from store and set to a variable
    const getAll = transObjectStore.getAll();

    getAll.onsuccess = function() {
    //if there was data in indexedDb's store, send it to the api server
    if (getAll.result.length > 0) {
        fetch('/api/transaction', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(serverResponse => {
            if (serverResponse.message) {
                throw new Error(serverResponse);
            }
            const transaction = db.transaction(['new_transaction'], 'readwrite');
            const transObjectStore = transaction.objectStore('new_transaction');
            //clear all items in store
            transObjectStore.clear();
        })
        .catch(err => {
            console.log(err);
        });
    }};
}

//listen for app coming back online
window.addEventListener('online', uploadTransaction);