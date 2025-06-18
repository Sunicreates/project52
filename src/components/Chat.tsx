import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, File, X, Reply, Users, Inbox, MessageSquare, Trash2, User } from 'lucide-react';
import { getCurrentUser } from '@/lib/github-auth';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API_URL = 'https://five2projects.onrender.com/api';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  timestamp: number;
  isAdmin: boolean;
  recipientId?: string;
  isBroadcast?: boolean;
  replyTo?: {
    senderId: string;
    senderName: string;
    content: string;
  };
}

interface ChatProps {
  isAdmin?: boolean;
  onClose?: () => void;
}

export const Chat = ({ isAdmin = false, onClose }: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<{ url: string; name: string; type: string; size: number } | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('everyone');
  const [activeTab, setActiveTab] = useState<'chat' | 'inbox'>('chat');
  const [adminView, setAdminView] = useState<'broadcast' | 'user'>('broadcast');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const currentUser = getCurrentUser();

  // Get unique users from messages
  const users = Array.from(new Set(messages.map(msg => msg.senderId)))
    .map(id => {
      const msg = messages.find(m => m.senderId === id);
      return {
        id,
        name: msg?.senderName || 'Unknown User'
      };
    });

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${API_URL}/chat`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        
        // Filter messages based on visibility rules
        const filteredMessages = data.messages.filter((message: Message) => {
          if (isAdmin) {
            // Admin can see all messages
            return true;
          } else {
            // Regular users can only see:
            // 1. Their own messages
            // 2. Messages sent to them by admin
            // 3. Messages sent to everyone
            return (
              message.senderId === currentUser?.id ||
              (message.isAdmin && (!message.recipientId || message.recipientId === currentUser?.id)) ||
              (!message.recipientId && !message.isAdmin)
            );
          }
        });
        
        setMessages(filteredMessages);
      } catch (error) {
        toast.error('Failed to load messages');
      }
    };

    fetchMessages();
    // Set up polling for new messages
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [isAdmin, currentUser?.id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size should be less than 10MB');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview({
          url: reader.result as string,
          name: file.name,
          type: file.type,
          size: file.size
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    try {
      if (!currentUser) {
        toast.error('User information not found. Please log in again.');
        return;
      }

      const messageData = {
        content: isAdmin && adminView === 'user' && selectedUser !== 'everyone'
        ? `  ${newMessage.trim()}`
        : newMessage.trim(),
        fileUrl: filePreview?.url,
        fileName: filePreview?.name,
        fileType: filePreview?.type,
        fileSize: filePreview?.size,
        isAdmin,
        senderId: currentUser.id,
        senderName: currentUser.name || currentUser.login || currentUser.email,
        replyTo: replyTo ? {
          senderId: replyTo.senderId,
          senderName: replyTo.senderName,
          content: replyTo.content
        } : undefined,
        recipientId: isAdmin && adminView === 'user' ? selectedUser : undefined,
        isBroadcast: isAdmin && adminView === 'broadcast'
      };

      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to send message');
      }
      
      const newMessageData = await response.json();
      setMessages(prev => [...prev, newMessageData]);

      // Clear input and file
      setNewMessage('');
      setSelectedFile(null);
      setFilePreview(null);
      setReplyTo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // If admin sent a broadcast, show success message
      if (isAdmin && adminView === 'broadcast') {
        toast.success('Broadcast message sent to all users');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    return '📎';
  };

  // Filter messages for inbox (only direct messages from admin to user)
  const inboxMessages = messages.filter(message => {
    if (isAdmin) return false; // Admin doesn't need inbox
    return message.isAdmin && !message.isBroadcast && message.recipientId === currentUser?.id;
  });

  // Filter messages for chat based on admin view
  const chatMessages = messages.filter(message => {
    if (isAdmin) {
      if (adminView === 'broadcast') {
        return message.isAdmin && message.isBroadcast;// Show only broadcast messages
      } else if (adminView === 'user') {
        // For user chat view, show direct messages between admin and selected user
        return true;
      }
    } else {
      // For regular users, show their direct messages with admin and broadcast messages
      return (
        message.senderId === currentUser?.id ||
        (message.isAdmin && (
          message.content.startsWith(`[to:${currentUser?.id}]`) ||
          !message.content.startsWith('[to:')
        ))
      );
    }
  });

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Authentication token missing. Please log in again.');
        return;
      }

      const response = await fetch(`${API_URL}/chat/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.success('Message deleted successfully');
    } catch (error) {
      toast.error('Failed to delete message. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="bg-gray-800 border-green-500/20 w-full max-w-2xl h-[80vh] flex flex-col relative">
        <CardHeader className="border-b border-green-500/20 flex flex-row items-center justify-between p-4">
          <CardTitle className="text-green-400">
            {isAdmin 
              ? adminView === 'broadcast' 
                ? 'Admin Broadcast' 
                : 'User Chat'
              : 'Chat with Admin'}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
          {!isAdmin && (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'chat' | 'inbox')} className="mb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="inbox" className="flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  Inbox
                  {inboxMessages.length > 0 && (
                    <span className="bg-green-500 text-black rounded-full px-2 py-0.5 text-xs">
                      {inboxMessages.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {isAdmin && (
            <div className="mb-4">
              <Tabs value={adminView} onValueChange={(value) => setAdminView(value as 'broadcast' | 'user')} className="mb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="broadcast" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    not working
                  </TabsTrigger>
                  <TabsTrigger value="user" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User Chat
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              {adminView === 'user' && (
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-full bg-gray-700 border-green-500/30 text-white">
                    <SelectValue placeholder="Select user to chat with" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar"
          >
            {(activeTab === 'chat' ? chatMessages : inboxMessages).map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isAdmin ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.isAdmin
                      ? message.isBroadcast
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-700 text-white'
                      : 'bg-green-500/20 text-green-400'
                  }`}
                >
                  {message.isBroadcast && (
                    <div className="text-xs text-blue-400 mb-1 font-bold">
                      📢 Broadcast Message
                    </div>
                  )}
                  {message.replyTo && (
                    <div className="text-xs text-gray-400 mb-1 border-l-2 border-green-500 pl-2">
                      Replying to {message.replyTo.senderName}: {message.replyTo.content}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mb-1">
                    {message.senderName}
                    {message.recipientId && message.recipientId !== 'everyone' && !message.isBroadcast && (
                      <span className="ml-2 text-xs text-gray-500">
                        (to {users.find(u => u.id === message.recipientId)?.name || 'Unknown'})
                      </span>
                    )}
                  </div>
                  {message.content && <div className="mb-2 break-words">{message.content}</div>}
                  {message.fileUrl && (
                    <div className="mb-2">
                      {message.fileType?.startsWith('image/') ? (
                        <img
                          src={message.fileUrl}
                          alt={message.fileName}
                          className="max-w-full rounded-lg"
                        />
                      ) : (
                        <a
                          href={message.fileUrl}
                          download={message.fileName}
                          className="flex items-center space-x-2 text-sm text-blue-400 hover:text-blue-300"
                        >
                          <span>{getFileIcon(message.fileType || '')}</span>
                          <span>{message.fileName}</span>
                          {message.fileSize && (
                            <span className="text-gray-400">
                              ({formatFileSize(message.fileSize)})
                            </span>
                          )}
                        </a>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      {isAdmin && !message.isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyTo(message)}
                          className="text-xs text-green-400 hover:text-green-300"
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                      )}
                      {(isAdmin || message.senderId === currentUser?.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMessage(message.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {activeTab === 'chat' && (
            <div className="space-y-2 mt-auto">
              {replyTo && (
                <div className="flex items-center justify-between bg-gray-700 rounded-lg p-2 mb-2">
                  <div className="text-sm text-gray-300">
                    Replying to {replyTo.senderName}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyTo(null)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {filePreview && (
                <div className="relative inline-block">
                  <div className="flex items-center space-x-2 bg-gray-700 rounded-lg p-2">
                    <span>{getFileIcon(filePreview.type)}</span>
                    <span className="text-sm">{filePreview.name}</span>
                    <span className="text-xs text-gray-400">
                      ({formatFileSize(filePreview.size)})
                    </span>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                  >
                    <File className="h-4 w-4" />
                  </Button>
                </label>
                
                {isAdmin && adminView === 'user' && (
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="w-[150px] bg-gray-700 border-green-500/30 text-white">
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 border-green-500/30 text-white placeholder:text-gray-400"
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-green-500 text-black hover:bg-green-400"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};