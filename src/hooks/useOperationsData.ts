import { useMemo, useState } from 'react';
import {
	getRequiredApprovalRole,
	transactionSeedData,
	type FinanceApprovalRole,
	type Transaction,
	type TransactionStatus,
	type TxType
} from '../data/finance';
import { requestSeedData, type RequestFinanceDraft, type RequestItem, type RequestStatus } from '../data/requests';
import type { UserAccount, UserRole } from '../types/app';

export interface FinanceDraftInput {
	title: string;
	amount: number;
	type: TxType;
	category: string;
}

export interface RequestUpsertInput {
	id?: string;
	mssv: string;
	name: string;
	type: RequestItem['type'];
	date: string;
	reason: string;
	financeDraft?: RequestFinanceDraft;
}

export interface TransactionUpsertInput {
	id?: string;
	date: string;
	title: string;
	type: TxType;
	amount: number;
	owner: string;
	category: string;
	approvalNote?: string;
	linkedRequest?: Transaction['linkedRequest'];
}

interface RequestDecisionInput {
	requestId: string;
	status: Exclude<RequestStatus, 'Chờ duyệt'>;
	reviewerLabel: string;
	reviewedAt: string;
	reviewNote?: string;
}

interface TransactionDecisionInput {
	transactionId: string;
	status: Exclude<TransactionStatus, 'Chờ duyệt'>;
	reviewerLabel: string;
	reviewedAt: string;
	reviewNote?: string;
}

const nextTransactionId = (list: Transaction[]) => {
	const maxId = list.reduce((max, item) => {
		const n = Number(item.id.replace('TX-', ''));
		return Number.isFinite(n) ? Math.max(max, n) : max;
	}, 0);
	return `TX-${maxId + 1}`;
};

const nextRequestId = (list: RequestItem[]) => {
	const maxId = list.reduce((max, item) => {
		const n = Number(item.id.replace('REQ-', ''));
		return Number.isFinite(n) ? Math.max(max, n) : max;
	}, 0);
	return `REQ-${String(maxId + 1).padStart(3, '0')}`;
};

export const todayViDate = () => {
	const now = new Date();
	const dd = String(now.getDate()).padStart(2, '0');
	const mm = String(now.getMonth() + 1).padStart(2, '0');
	const yyyy = now.getFullYear();
	return `${dd}/${mm}/${yyyy}`;
};

export const parseViDate = (input: string) => {
	const [dd, mm, yyyy] = input.split('/');
	return new Date(Number(yyyy), Number(mm) - 1, Number(dd)).getTime();
};

const mapFinanceDraft = (draft?: RequestFinanceDraft): RequestFinanceDraft | undefined => {
	if (!draft) {
		return undefined;
	}
	return {
		enabled: draft.enabled,
		title: draft.title?.trim(),
		amount: draft.amount,
		type: draft.type,
		category: draft.category?.trim()
	};
};

const canFinanceRoleReview = (role: UserRole, requiredRole?: FinanceApprovalRole) => {
	if (role === 'bcn') {
		return true;
	}
	if (!requiredRole) {
		return role === 'bvh_finance';
	}
	return role === requiredRole;
};

const defaultTransactionStatus = (type: TxType) => (type === 'Thu' ? 'Đã duyệt' : 'Chờ duyệt');

const getReviewerLabel = (user: UserAccount) => user.fullName;

export const useOperationsData = () => {
	const [transactions, setTransactions] = useState<Transaction[]>(transactionSeedData);
	const [requests, setRequests] = useState<RequestItem[]>(requestSeedData);

	const activeTransactions = useMemo(() => transactions.filter((item) => !item.isDeleted), [transactions]);
	const pendingTransactions = useMemo(() => activeTransactions.filter((item) => item.status === 'Chờ duyệt'), [activeTransactions]);

	const totalIncome = useMemo(
		() =>
			activeTransactions
				.filter((item) => item.type === 'Thu' && item.status === 'Đã duyệt')
				.reduce((sum, item) => sum + item.amount, 0),
		[activeTransactions]
	);

	const totalExpense = useMemo(
		() =>
			activeTransactions
				.filter((item) => item.type === 'Chi' && item.status === 'Đã duyệt')
				.reduce((sum, item) => sum + item.amount, 0),
		[activeTransactions]
	);

	const currentFund = totalIncome - totalExpense + 3200000;

	const pendingRequests = useMemo(() => requests.filter((item) => item.status === 'Chờ duyệt'), [requests]);

	const upsertTransaction = (input: TransactionUpsertInput, actor: UserAccount) => {
		const normalized: Transaction = {
			id: input.id ?? nextTransactionId(transactions),
			date: input.date,
			title: input.title.trim(),
			type: input.type,
			amount: input.amount,
			owner: input.owner.trim(),
			category: input.category.trim(),
			status: defaultTransactionStatus(input.type),
			requiredApprovalRole: getRequiredApprovalRole(input.type, input.category.trim()),
			approvalNote: input.approvalNote?.trim(),
			linkedRequest: input.linkedRequest,
			reviewer: input.type === 'Thu' ? getReviewerLabel(actor) : undefined,
			reviewedAt: input.type === 'Thu' ? todayViDate() : undefined
		};

		if (input.id) {
			setTransactions((prev) => prev.map((item) => (item.id === input.id ? { ...item, ...normalized } : item)));
			return normalized.id;
		}

		setTransactions((prev) => [...prev, normalized]);
		return normalized.id;
	};

	const reviewTransaction = (input: TransactionDecisionInput, actor: UserAccount) => {
		let applied = false;

		setTransactions((prev) =>
			prev.map((item) => {
				if (item.id !== input.transactionId || item.status !== 'Chờ duyệt') {
					return item;
				}

				if (!canFinanceRoleReview(actor.role, item.requiredApprovalRole)) {
					return item;
				}

				applied = true;
				return {
					...item,
					status: input.status,
					reviewer: input.reviewerLabel,
					reviewedAt: input.reviewedAt,
					approvalNote: input.reviewNote?.trim() || item.approvalNote
				};
			})
		);

		return applied;
	};

	const softDeleteTransaction = (transactionId: string, actor: UserAccount) => {
		if (!['bcn', 'bvh_finance'].includes(actor.role)) {
			return false;
		}

		let applied = false;
		setTransactions((prev) =>
			prev.map((item) => {
				if (item.id !== transactionId || item.isDeleted) {
					return item;
				}
				applied = true;
				return {
					...item,
					isDeleted: true,
					deletedAt: todayViDate(),
					deletedBy: actor.fullName
				};
			})
		);

		return applied;
	};

	const upsertRequest = (input: RequestUpsertInput) => {
		const normalized: RequestItem = {
			id: input.id ?? nextRequestId(requests),
			mssv: input.mssv.trim(),
			name: input.name.trim(),
			type: input.type,
			date: input.date,
			reason: input.reason.trim(),
			status: 'Chờ duyệt',
			reviewer: undefined,
			reviewedAt: undefined,
			reviewNote: undefined,
			linkedTransactionId: undefined,
			financeDraft: mapFinanceDraft(input.financeDraft)
		};

		if (input.id) {
			setRequests((prev) => prev.map((item) => (item.id === input.id ? { ...item, ...normalized } : item)));
			return normalized.id;
		}

		setRequests((prev) => [...prev, normalized]);
		return normalized.id;
	};

	const createTransactionFromRequest = (request: RequestItem, reviewer: UserAccount) => {
		if (!request.financeDraft?.enabled || request.linkedTransactionId) {
			return undefined;
		}

		const draft = request.financeDraft;
		if (!draft.title || !draft.amount || !draft.type || !draft.category || draft.amount <= 0) {
			return undefined;
		}

		const transactionId = upsertTransaction(
			{
				date: request.reviewedAt ?? todayViDate(),
				title: draft.title,
				type: draft.type,
				amount: draft.amount,
				owner: request.name,
				category: draft.category,
				approvalNote: `Sinh từ ${request.id}`,
				linkedRequest: {
					requestId: request.id,
					requestType: request.type
				}
			},
			reviewer
		);

		return transactionId;
	};

	const reviewRequest = (input: RequestDecisionInput, actor: UserAccount) => {
		let transactionIdFromRequest: string | undefined;

		setRequests((prev) =>
			prev.map((item) => {
				if (item.id !== input.requestId || item.status !== 'Chờ duyệt') {
					return item;
				}

				const updated: RequestItem = {
					...item,
					status: input.status,
					reviewer: input.reviewerLabel,
					reviewedAt: input.reviewedAt,
					reviewNote: input.reviewNote?.trim() || item.reviewNote
				};

				if (updated.status === 'Đã duyệt') {
					const linkedId = createTransactionFromRequest(updated, actor);
					if (linkedId) {
						transactionIdFromRequest = linkedId;
						updated.linkedTransactionId = linkedId;
					}
				}

				return updated;
			})
		);

		return transactionIdFromRequest;
	};

	const canReviewFinanceTransaction = (actor: UserAccount, transaction: Transaction) =>
		transaction.status === 'Chờ duyệt' && !transaction.isDeleted && canFinanceRoleReview(actor.role, transaction.requiredApprovalRole);

	return {
		requests,
		transactions,
		activeTransactions,
		pendingTransactions,
		pendingRequests,
		totalIncome,
		totalExpense,
		currentFund,
		upsertTransaction,
		reviewTransaction,
		softDeleteTransaction,
		upsertRequest,
		reviewRequest,
		canReviewFinanceTransaction
	};
};

