import { Button, Card, Typography } from '@mui/material';
import { CloudSync } from '@mui/icons-material';

const CustomeRefreshBtn = ({ clickEvent }) => {
  return (
    <Card className='w-40 h-36'>
      <Button className='w-full h-full gap-2' variant='outlined' color='inherit' onClick={clickEvent} >
        <CloudSync className='!w-12 !h-12 text-primary' />
        <Typography className='text-center text-primary font-bold'>Refresh</Typography>
      </Button>
    </Card>
  )
}

export default CustomeRefreshBtn