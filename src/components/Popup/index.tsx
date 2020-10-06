import * as React from "react";
import { useState, useEffect } from "react";
import "./index.scss";

const Popup = () => {
  const [isLoad, setIsLoad] = useState<boolean>(false);
  const [isAlwaysOn, setIsAlwaysOn] = useState<boolean>(false);

  const toggleAlwaysOn = () => {
    if (isLoad) {
      chrome.storage.local.set(
        {
          "handaet-ao": !isAlwaysOn ? "on" : "off",
        },
        () => {
          setIsAlwaysOn((prev: boolean) => !prev);
        }
      );
    }
  };

  useEffect(() => {
    chrome.storage.local.get("handaet-ao", (items) => {
      if (items["handaet-ao"]) setIsAlwaysOn(items["handaet-ao"] === "on");
    });

    setIsLoad(true);
  }, []);

  return (
    <div id="popup">
      <h1 className="title-text">한댓 | 설정</h1>
      <div className="settings-wrap">
        <div className={`setttings-inner-wrap ${isLoad ? "loaded" : "loading"}`}>
          <div className="always-on-setting">
            <span>항상 한글 댓글 보기</span>
            <div
              className={`slide-btn-box ${isAlwaysOn ? "on" : "off"}`}
              role="button"
              onClick={() => toggleAlwaysOn()}
            >
              <div className="slide-btn-circle"></div>
            </div>
          </div>
        </div>
      </div>
      <p className="message">유튜브 웹 새로고침 이후 변경된 설정이 적용됩니다</p>
      <footer>
        <a href="mailto:junhobaik@gmail.com">
          <span>© 2020 Junho Baik</span>
        </a>
        <a href="#">
          <span>문제 제보</span>
        </a>
      </footer>
    </div>
  );
};

export default Popup;
