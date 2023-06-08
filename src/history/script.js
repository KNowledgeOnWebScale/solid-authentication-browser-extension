window.onload = () => {
  chrome.storage.local.get('history', result => {
    const history = result.history || [];
    showHistory(history);
  });

  document.getElementById('clear-history-button').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      msg: "clear-history"
    });

    showHistory([]);
  });
};

function showHistory(history) {
  // const $tbody = document.querySelector('#table tbody');
  //
  // $tbody.innerHTML = '';
  //
  // history.forEach(request => {
  //   const {date, url, method, webId} = request;
  //   const $tr = document.createElement('tr');
  //   $tr.innerHTML += `<td>${date}</td>`;
  //   $tr.innerHTML += `<td><a href="${url}">${url}</a></td>`;
  //   $tr.innerHTML += `<td>${method}</td>`;
  //   $tr.innerHTML += `<td><a href="${webId}">${webId}</a></td>`;
  //   $tbody.appendChild($tr);
  // });
  history.forEach(request => {
    request.date = request.date.toISOString();
  });

  new window.gridjs.Grid({
    columns: [{
      id: 'date', name: 'Date', sort: true, resizable: true,
    },{
      id: 'url', name: 'URL', sort: true, width: '750px'
    }, {
      id: 'method', name: 'Method', sort: true, width: '130px'
    }, {
      id: 'webId', name: 'WebID', sort: true, resizable: true,
    }], data: history,
    search: true
  }).render(document.getElementById("wrapper"));
}
