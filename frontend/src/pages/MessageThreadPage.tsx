import React from 'react';
import { useParams } from '@tanstack/react-router';
import MessagesPage from './MessagesPage';

export default function MessageThreadPage() {
  const { principalId } = useParams({ strict: false }) as { principalId: string };
  return <MessagesPage initialPrincipal={principalId} />;
}
