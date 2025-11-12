(function () {
  const root = document.documentElement;
  const key = 'vpp-theme';
  const btn = document.createElement('button');
  btn.className = 'vpp-theme-toggle';
  btn.type = 'button';
  btn.textContent = (localStorage.getItem(key) || 'light') === 'dark' ? 'Light' : 'Dark';
  btn.addEventListener('click', () => {
    const cur = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', cur);
    localStorage.setItem(key, cur);
    btn.textContent = cur === 'dark' ? 'Light' : 'Dark';
  });
  document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem(key) || 'light';
    root.setAttribute('data-theme', saved);
    document.querySelector('.masthead')?.appendChild(btn);
  });
})();
