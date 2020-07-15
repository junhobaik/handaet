document.addEventListener("DOMContentLoaded", () => {
  $(function () {
    $(document).tooltip();
  });

  chrome.storage.local.get("ohc", function (items) {
    const setting = items.ohc ?? [false, true];

    let checkboxList = document.querySelectorAll(".option input");
    for (let i = 0; i < checkboxList.length; i++) {
      checkboxList[i].checked = setting[i];
    }
  });

  document.querySelector("body").addEventListener("change", () => {
    const checkbox = Array.from(document.querySelectorAll(".option input"));

    const result = checkbox.reduce((prev, curr, i) => {
      if (!prev) prev = [];
      return [...prev, curr.checked];
    }, "");

    chrome.storage.local.set(
      {
        ohc: result,
      },
      function () {}
    );
  });
});
