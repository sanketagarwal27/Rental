import React from 'react';
import Sidebar from '../components/Sidebar';
import SupportChat from '../components/SupportChat';

const Messages = () => {
  return (
    <div className="flex bg-zinc-950 min-h-screen text-zinc-100">
      <Sidebar />
      <main className="flex-1 lg:ml-0 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 lg:p-10 h-full flex flex-col">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Support Messages</h1>
            <p className="text-zinc-400 mt-1 text-sm">Chat directly with the platform's support team.</p>
          </div>
          
          <div className="flex-1 min-h-[500px]">
            {/* We reuse the SupportChat component but force it into non-widget mode */}
            <SupportChat isWidget={false} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
