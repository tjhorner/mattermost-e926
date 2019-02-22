var config

try {
  config = require('./config.json')
} catch(e) {
  config = process.env
}

const express = require('express')
const bodyParser = require('body-parser')

const app = express()

// app.use(bodyParser.json({ extended: true }))
app.use(bodyParser.urlencoded({ extended: true }))

const request = (url, opts) => {
  return new Promise((resolve, reject) => {
    require('request')(url, opts, (err, res, body) => {
      if(err) reject(err)
      if(!err) resolve({ res, body })
    })
  })
}

app.post("/e926", async (req, res) => {
  if(req.body.token !== config.COMMAND_TOKEN) {
    res.sendStatus(401)
    return
  }
  
  const { body: posts } = await request("https://e926.net/post/index.json", {
    json: true,
    headers: {
      "User-Agent": "mattermost e926 poster (telegram: @tjhorner)"
    },
    qs: {
      tags: `order:random ${req.body.text}`,
      limit: 1
    }
  })

  var payload

  if(posts.length === 0) {
    payload = {
      text: "No posts were found :(",
      response_type: "ephemeral"
    }
  } else {
    const post = posts[0]
    payload = {
      text: `@${req.body.user_name} Here is a random post${req.body.text.trim() === "" ? "" : ` for \`${req.body.text.replace(/`/gi, "")}\``}:`,
      response_type: "in_channel",
      attachments: [
        {
          fallback: "A post on e926",
          color: "#152f56",
          author_name: post.author,
          author_link: `https://e926.net/user/show/${post.creator_id}`,
          title: `#${post.id} - ${post.artist.length === 0 ? "unknown artist" : post.artist[0]}`,
          title_link: `https://e926.net/post/show/${post.id}`,
          text: post.tags.split(" ").join(", "),
          image_url: post.sample_url
        }
      ]
    }
  }

  res.send(payload)
})

app.listen(process.env.PORT || 3000)