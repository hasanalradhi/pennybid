export type TenderStatus = 'Open' | 'Under Review' | 'Closed';

export interface Bid {
  id: string;
  tenderId: string;
  amount: number;
  vendorName: string;
  submittedAt: string;
}

export interface Tender {
  id: string;
  title: string;
  description: string;
  quantity: number;
  deadline: string;
  status: TenderStatus;
  lowestBid: number | null;
  bidsCount: number;
  createdAt: string;
  bids?: Bid[];
}

export interface CreateTenderRequest {
  title: string;
  description: string;
  quantity: number;
  deadline: string;
  status?: TenderStatus;
}

export interface SubmitBidRequest {
  amount: number;
  vendorName: string;
}

export interface BidSubmissionResponse {
  message: string;
  bid: Bid;
  tender: Tender;
}
