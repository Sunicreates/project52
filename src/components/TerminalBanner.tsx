
import { useState, useEffect } from 'react';

export const TerminalBanner = () => {
  const [text, setText] = useState('');
  const fullText = '$ npm start 52-projects';
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorTimer);
  }, []);

  return (
    <div className="bg-black border border-green-500 rounded-lg p-4 mb-8 max-w-md mx-auto">
      <div className="text-green-400 font-mono text-lg">
        {text}
        <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
          |
        </span>
      </div>
    </div>
  );
};
