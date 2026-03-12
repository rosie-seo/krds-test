fetch('../html/code/header.html')
  .then(res => res.text())
  .then(data => document.getElementById('header').innerHTML = data);

fetch('../html/code/footer.html')
  .then(res => res.text())
  .then(data => document.getElementById('footer').innerHTML = data);

fetch('../html/code/side_navigation.html')
  .then(res => res.text())
  .then(data => document.getElementById('side_navigation').innerHTML = data);
