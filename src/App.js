// import React from 'react';


function App(){
    const title='Blog Post'
    const body='This is m blog post'
    const comments=[
        {id:1,text: 'Comment 1'},
        {id:2,text: 'Comment 2'},
        {id:3,text: 'Comment 3'},
        {id:4,text: 'Comment 4'},
        {id:5,text: 'Comment 5'},
    ]
    const loading=false
    const showComments=true
    if(loading) return <h1>Loading....</h1>
    const commentBlock=(
        <div className='comments'>
            <h3>Comments ({comments.length})</h3>
            <ul>
                {comments.map((comment,index)=>(
                    <li key={index}>
                        {comment.text}
                    </li>
                ))}
            </ul>
        </div>
    )
    // return (
    //     <div>
    //         <h1>Hello from the app component</h1>
    //         <p>Rasim Aghayev</p>
    //     </div>
    // )
    // return React.createElement(
    //     'div',
    //     {className:'container'},
    //     React.createElement(
    //         'h1',
    //         {},
    //         'My App'
    //         )
    // )
    return (
        <div className='container'>
            <h1>{title}</h1>
            <p>{body}</p>
            {showComments&&commentBlock}
        </div>
    )
}
export default App