var popupBorder = { width:window.outerWidth - window.innerWidth, height:window.outerHeight - window.innerHeight };
chrome.runtime.sendMessage({action:'setItem', id:'popupBorder', data:JSON.stringify(popupBorder)});
