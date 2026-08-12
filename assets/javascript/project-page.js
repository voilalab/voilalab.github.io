(function() {
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    return Promise.resolve();
  }

  document.addEventListener('click', function(event) {
    var button = event.target.closest('[data-copy-target]');
    if (!button) return;

    var target = document.getElementById(button.dataset.copyTarget);
    var status = document.getElementById(button.dataset.copyStatus);
    if (!target) return;

    copyText(target.textContent.trim()).then(function() {
      button.textContent = 'Copied';
      if (status) status.textContent = 'Copied';
      window.setTimeout(function() {
        button.textContent = 'Copy';
        if (status) status.textContent = '';
      }, 2200);
    }).catch(function() {
      if (status) status.textContent = 'Select the text below';
    });
  });
})();
