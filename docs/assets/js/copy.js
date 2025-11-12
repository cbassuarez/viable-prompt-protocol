(function () {
  function addCopy(btn, pre) {
    btn.addEventListener('click', () => {
      const code = pre.querySelector('code');
      if (!code) return;
      navigator.clipboard.writeText(code.innerText.trim()).then(() => {
        btn.textContent = 'Copied';
        setTimeout(() => (btn.textContent = 'Copy'), 1200);
      });
    });
  }
  document.querySelectorAll('pre').forEach(pre => {
    const btn = document.createElement('button');
    btn.className = 'vpp-copy';
    btn.type = 'button';
    btn.textContent = 'Copy';
    pre.style.position = 'relative';
    btn.style.position = 'absolute';
    btn.style.top = '8px'; btn.style.right = '8px';
    pre.appendChild(btn);
    addCopy(btn, pre);
  });
})();
