export const SpinnerLoading = () => {
  return (
<div
      style={{
        // Make it an overlay
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',

        // Use flex to center the spinner
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',

        // Ensure it's on top of the map
        zIndex: 10,

        // Add a background to dim the map
        backgroundColor: 'rgba(255, 255, 255, 0.35)'
      }}
    >
      <div className='spinner-border text-primary' role='status'>
        <span className='visually-hidden'>
          Loading...
        </span>
      </div>
    </div>
  );}