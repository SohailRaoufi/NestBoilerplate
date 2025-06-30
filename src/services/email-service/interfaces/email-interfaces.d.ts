import { SupportRequest } from '@/entities/app/support-request.entity';
import { ValidatedDocumentDto } from '@/events/definations/admin/client.events';

interface ISendForgetPasswordPayload {
  fullName: string;
  email: string;
  token: string;
  expiry: Date;
}

interface ISendInstructorInvalidDocument {
  email: string;
  fullName: string;
  documents: ValidatedDocumentDto[];
}

interface ISendAccountVerifiedEmail {
  email: string;
  fullName: string;
}

interface ISendSupportResolvedEmail {
  supportRequest: SupportRequest;
}
