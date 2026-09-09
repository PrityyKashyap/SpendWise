import { useParams } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch.js';
import { getGroup } from '../services/groupService.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import GroupExpenseForm from '../components/groups/GroupExpenseForm.jsx';
import Card from '../components/ui/Card.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';

export default function AddGroupExpense() {
  const { groupId } = useParams();
  const { data: group, error, isLoading, refetch } = useFetch(() => getGroup(groupId), [groupId]);

  if (isLoading) return <Skeleton className="h-96" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <>
      <PageHeader title="Add group expense" subtitle={group.name} />
      <Card className="p-5">
        <GroupExpenseForm group={group} />
      </Card>
    </>
  );
}
