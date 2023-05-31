"use client";
import ThemeChanger from "@/app/components/ThemeChanger";
import { signOut } from "next-auth/react";
import { Dispatch, SetStateAction } from "react";

type ChatHeaderProps = {
  allMessages: boolean;
  setAllMessages: Dispatch<SetStateAction<boolean>>;
};

const ChatHeader = ({ allMessages, setAllMessages }: ChatHeaderProps) => {
  const handleClick = async () => {
    await signOut({ callbackUrl: "/" });
  };
  return (
    <header className="h-[48px] p-2 flex-none bg-white dark:bg-black border-solid border-b border-gray-300 dark:border-gray-700 flex items-center">
      <span
        onClick={() => {
          setAllMessages(!allMessages);
        }}
        className="text-md text-black hover:bg-gray-200 hover:dark:bg-gray-800 transition dark:text-gray-200 px-4 cursor-pointer"
      >
        {allMessages ? "チャット" : "トップチャット"}
      </span>
      <div className="flex-auto" />
      <ThemeChanger />
      <button
        className="bg-sky-500 px-2 py-1 hover:bg-sky-700 transition shadow ml-2 mr-4 rounded-md text-white"
        onClick={handleClick}
      >
        Sign out
      </button>
    </header>
  );
};

export default ChatHeader;
