export enum SocketEvents {
  Connection = 'connection',
  Message = 'message',
  Chat_Join = 'chat_join',
  Heartbeat = 'heartbeat',
  User_Status_Update = 'user_status_update',
  Message_Status_Update = 'message_status_update',
  Mark_One_Message_As_Delivered = 'mark_messages_as_delivered',
  Mark_One_Message_As_Seen = 'mark_messages_as_seen',
  Mark_Messages_As_Delivered = 'mark_messages_as_delivered',
  Mark_Messages_As_Seen = 'mark_messages_as_seen',
  Friends_Status = 'friends_status',
  Notification = 'notification',
  Mark_Notifications_As_Read = 'mark_notifications_as_read',
  Genai_Response_Append = 'genai_response_append',
  Custom_Error = 'custom_error',
  Disconnecting = 'disconnecting',
  Disconnect = 'disconnect',
}
