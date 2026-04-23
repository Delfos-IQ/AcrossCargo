import React from 'react';

export default function Footer() {
  return (
    <footer className="app-footer">
      &copy; {new Date().getFullYear()} GSSA Cargo Management System. All rights reserved.
    </footer>
  );
}
