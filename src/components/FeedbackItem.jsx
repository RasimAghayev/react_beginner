
import PropTypes from 'prop-types'
import Card from "./shared/Card"
import {FaTimes} from 'react-icons/fa';
function FeedbackItem({item}) {
const handleClick=(id)=>{
  console.log(id)
}
  return (
    <Card>  {/*reverse={false} */ }
      <div className="num-display">{item.rating}</div>
      <button onClick={()=>handleClick(item.id)} className='close'>
        <FaTimes color='purple'/>
      </button>
      <div className="text-display">
          {item.text}
      </div>
      {/* <button onClick={handleClick}>Click</button> */}
    </Card>
  )
}

FeedbackItem.propTypes={
  item:PropTypes.object.isRequired,

}

export default FeedbackItem 