import "./watch.scss";

chrome.storage.local.get("handaet-ao", (items) => {
  const isAlwaysOn = items["handaet-ao"] === "on";

  let isActive = isAlwaysOn;
  let prevPathName = "";
  let isActiveChanged = false;

  const delay = (s = 1000) => {
    return new Promise((resolve) =>
      setTimeout(() => {
        resolve();
      }, s)
    );
  };

  const isHangulText = (char: string) => {
    const c = char.charCodeAt(0);
    return (0x1100 <= c && c <= 0x11ff) || (0x3130 <= c && c <= 0x318f) || (0xac00 <= c && c <= 0xd7a3);
  };

  const detect = () => {
    const list = Array.from(document.querySelectorAll("#content-text.ytd-comment-renderer")) as HTMLElement[];

    if (list.length) {
      for (const c of list) {
        const comment = c.innerText;
        const commentLength = comment.length;
        const text = comment.substr(0, 6) + comment.substr(commentLength - 6, commentLength - 1);

        let isHangulComment = false;

        for (const t of text) {
          if (isHangulText(t)) {
            isHangulComment = true;
            break;
          }
        }

        if (!isHangulComment)
          (c?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode as
            | HTMLElement
            | undefined)?.classList.add("ohc-hide");
      }
    }
  };

  const repeatDetect = (times = 10) => {
    let n = 0;

    const timerID = setInterval(() => {
      if (++n >= times || !isActive) clearInterval(timerID);
      else detect();
    }, 500);
  };

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(function (mutation) {
      const { addedNodes } = mutation;

      if (mutation.nextSibling?.nodeName === "#text" && addedNodes.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addedNodes.forEach((node: any) => {
          if (node.id === "content-text" && node.classList?.contains("ytd-comment-renderer")) {
            const comment = node.innerText;
            const commentLength = comment.length;
            const text = comment.substr(0, 6) + comment.substr(commentLength - 6, commentLength - 1);

            let isHangulComment = false;

            for (const c of text) {
              if (isHangulText(c)) {
                isHangulComment = true;
                break;
              }
            }

            if (!isHangulComment) {
              node.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.classList.add("ohc-hide");
            }
          }
        });
      }
    });
  });
  const observerConfig = { childList: true, subtree: true };

  const createButton = async () => {
    if (isAlwaysOn) repeatDetect();

    const comment = document.getElementById("comments") as HTMLElement | undefined;
    const commentHeader = document.querySelector("ytd-comments-header-renderer") as HTMLElement | undefined;
    const oldButton = document.querySelector("#ohc-button-wrap");

    if (oldButton) {
      oldButton.className = isActive ? "on" : "off";
    } else {
      if (comment && commentHeader) {
        const btnClickEvt = () => {
          if (!isActive) {
            repeatDetect();
          } else {
            const hideList = document.querySelectorAll(".ohc-hide");
            for (const v of Array.from(hideList)) {
              v.classList.remove("ohc-hide");
            }
          }

          isActive = !isActive;
          isActiveChanged = true;

          const btn = document.querySelector("#ohc-button-wrap");
          if (btn) btn.className = isActive ? "on" : "off";
        };

        const newBtn = document.createElement("div");
        newBtn.id = "ohc-button-wrap";
        newBtn.className = isActive ? "on" : "off";
        newBtn.style.position = "absolute";
        newBtn.style.right = "0";
        newBtn.innerHTML = `
        <div class="inner-wrap">
          <span class="korea">🇰🇷</span>
          <span class="world">한댓</span>
          <div class="circle"></div>
        </div>
      `;

        newBtn.addEventListener("click", btnClickEvt);

        commentHeader.style.position = "relative";
        commentHeader.appendChild(newBtn);
      } else {
        await delay();
        createButton();
      }
    }
  };

  const removeButton = () => {
    const oldBtn = document.getElementById("ohc-button-wrap");
    if (oldBtn) oldBtn.remove();
  };

  const sortButtonClickEvent = async () => {
    const btns = Array.from(document.querySelectorAll("#sort-menu a"));

    if (btns.length) {
      for (const b of btns) {
        b.addEventListener("click", () => {
          if (isActive) repeatDetect();
        });
      }
    } else {
      await delay();
      sortButtonClickEvent();
    }
  };

  setInterval(() => {
    const newPathName = window.location.pathname + window.location.search;
    const isNewPath = prevPathName !== newPathName;
    const isWatch = newPathName.includes("watch");

    if (isNewPath) {
      if (isWatch) {
        isActive = isAlwaysOn;

        createButton();
        sortButtonClickEvent();
      } else {
        removeButton();
      }
    }

    if (isWatch && (isActiveChanged || isNewPath)) {
      observer.disconnect();

      if (isActive) {
        const target = document.getElementById("comments");
        if (target) {
          observer.observe(target, observerConfig);
        }
      }

      if (isActiveChanged) isActiveChanged = false;
    }

    prevPathName = newPathName;
  }, 2000);
});
