"use client";

import ChatFooter from "./components/ChatFooter";
import ChatMainContent from "./components/ChatMainContent";
import ChatHeader from "./components/ChatHeader";
import { useState } from "react";
import ChatAllMainContent from "./components/ChatAllMainContent";

const LiveChat = () => {
  const [allMessages, setAllMessages] = useState(false);
  return (
    <>
      <div className="flex flex-col h-screen">
        <ChatHeader allMessages={allMessages} setAllMessages={setAllMessages} />
        {allMessages ? <ChatAllMainContent /> : <ChatMainContent />}
        <ChatFooter />
      </div>
    </>
  );
};

export default LiveChat;
