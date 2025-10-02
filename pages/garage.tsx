import { GetServerSideProps } from 'next'

export default function GarageRedirect() {
  return null
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/garages',
      permanent: false,
    },
  }
}
